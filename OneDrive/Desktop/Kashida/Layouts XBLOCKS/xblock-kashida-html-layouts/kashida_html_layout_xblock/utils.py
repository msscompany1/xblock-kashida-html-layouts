# -*- coding: utf-8 -*-
"""
Helpers functions for Kashida Image Explorer XBlock.
"""


def _(text):
    """
    Make '_' a no-op so we can scrape strings.
    """
    return text

import logging
import re

logger = logging.getLogger(__name__)

def log_message(message):
    """
    Log messages for debugging purposes.
    """
    logger.info(f"Kashida XBlock: {message}")

def is_valid_image_url(url):
    """
    Validate if the given URL is an image URL.
    """
    return bool(re.match(r'^https?:\/\/.*\.(jpg|jpeg|png|gif|svg)$', url))