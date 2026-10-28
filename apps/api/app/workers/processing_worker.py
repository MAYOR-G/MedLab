"""Background processing worker runtime."""

import asyncio

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import SessionLocal
from app.modules.processing.service import process_extraction_job
from app.services.job_service import claim_next_job, fail_job

logger = get_logger("workers.processing_worker")


class ProcessingWorker:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.running = False

    def process_one_job(self) -> bool:
        """Fetch and execute a single job from the queue. Returns True if a job was processed."""
        with SessionLocal() as db:
            job = claim_next_job(
                db,
                worker_heartbeat_timeout_seconds=self.settings.WORKER_HEARTBEAT_TIMEOUT_SECONDS,
            )
            if not job:
                return False

            logger.info(
                "Claimed job %s (type: %s, attempt: %d)",
                job.id,
                job.job_type,
                job.attempt_count,
            )
            try:
                if job.job_type == "extract":
                    process_extraction_job(db, job)
                    db.commit()
                    logger.info("Successfully completed extract job %s", job.id)
                elif job.job_type == "summarize":
                    # Summarization is handled directly or via worker
                    logger.info("Summarization job %s executed", job.id)
                    db.commit()
                elif job.job_type == "permanent_delete":
                    import uuid

                    from app.modules.records.service import permanent_delete_document
                    doc_id_str = job.payload.get("document_id") if job.payload else None
                    if doc_id_str and job.workspace_id:
                        permanent_delete_document(
                            db,
                            workspace_id=job.workspace_id,
                            user_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                            document_id=uuid.UUID(doc_id_str),
                        )
                    from app.services.job_service import complete_job
                    complete_job(db, job.id)
                    db.commit()
                    logger.info("Successfully completed permanent_delete job %s", job.id)
                elif job.job_type == "account_permanent_purge":
                    import uuid

                    from sqlalchemy import delete, select

                    from app.db.models import (
                        FamilyMember,
                        FamilyWorkspace,
                        MedicalDocument,
                    )
                    from app.modules.records.service import permanent_delete_document
                    from app.services.job_service import complete_job

                    if job.workspace_id:
                        docs = db.scalars(
                            select(MedicalDocument).where(
                                MedicalDocument.workspace_id == job.workspace_id
                            )
                        ).all()
                        for d in docs:
                            permanent_delete_document(
                                db,
                                workspace_id=job.workspace_id,
                                user_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                                document_id=d.id,
                            )
                        db.execute(
                            delete(FamilyMember).where(
                                FamilyMember.workspace_id == job.workspace_id
                            )
                        )
                        db.execute(
                            delete(FamilyWorkspace).where(
                                FamilyWorkspace.id == job.workspace_id
                            )
                        )
                    complete_job(db, job.id)
                    db.commit()
                    logger.info("Successfully completed account_permanent_purge job %s", job.id)
                else:
                    logger.warning(
                        "Unknown job type '%s' for job %s", job.job_type, job.id
                    )
                    fail_job(db, job.id, safe_error_code="UNSUPPORTED_JOB_TYPE")
                    db.commit()

                return True

            except Exception as exc:
                db.rollback()
                logger.exception("Job %s execution failed: %s", job.id, exc)
                try:
                    with SessionLocal() as fail_db:
                        fail_job(
                            fail_db, job.id, safe_error_code="WORKER_EXECUTION_FAILURE"
                        )
                        fail_db.commit()
                except Exception as fail_err:
                    logger.error(
                        "Failed to mark job %s as failed: %s", job.id, fail_err
                    )

                return True

    async def run_forever(self) -> None:
        """Continuous polling loop."""
        self.running = True
        logger.info(
            "MedLab processing worker started (poll_interval=%ds, concurrency=%d)",
            self.settings.WORKER_POLL_INTERVAL_SECONDS,
            self.settings.WORKER_CONCURRENCY,
        )

        while self.running:
            try:
                processed = self.process_one_job()
                if not processed:
                    await asyncio.sleep(self.settings.WORKER_POLL_INTERVAL_SECONDS)
            except Exception as loop_err:
                logger.error("Unexpected error in worker loop: %s", loop_err)
                await asyncio.sleep(self.settings.WORKER_POLL_INTERVAL_SECONDS)

        logger.info("Processing worker loop terminated cleanly.")

    def stop(self) -> None:
        self.running = False


worker = ProcessingWorker()
