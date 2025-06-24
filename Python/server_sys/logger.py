import logging
import os
from datetime import datetime

_loggers = {}

def setup_logger(name, log_folder):
    if name in _loggers:
        return _loggers[name]  # Évite de reconfigurer plusieurs fois

    os.makedirs(log_folder, exist_ok=True)
    log_filename = datetime.now().strftime(f"{name}_%Y-%m-%d_%H-%M-%S.log")
    log_path = os.path.join(log_folder, log_filename)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False  # Évite les doublons si root logger est utilisé ailleurs

    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    file_handler = logging.FileHandler(log_path)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Ajoute les handlers si ce n'est pas déjà fait
    if not logger.handlers:
        logger.addHandler(file_handler)
        #logger.addHandler(console_handler)

    _loggers[name] = logger
    return logger
