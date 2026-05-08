#!/bin/bash
stripe trigger checkout.session.completed --override "checkout_session:metadata.file_key=tresorerie-electricien.xlsx" --override "checkout_session:metadata.product_slug=tresorerie-electricien" --override "checkout_session:customer_email=achatsthomas@gmail.com"
