"""Standalone worker entrypoint for background processing jobs."""

import asyncio
import signal
import sys

from app.core.logging import get_logger, setup_logging
from app.workers.processing_worker import worker

logger = get_logger("workers.main")


def handle_shutdown(signum: int, frame: object) -> None:
    logger.info("Received termination signal %d, shutting down worker...", signum)
    worker.stop()
    sys.exit(0)


async def main() -> None:
    setup_logging()
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    await worker.run_forever()


if __name__ == "__main__":
    asyncio.run(main())
