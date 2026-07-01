# Project Document Categories Report

Date: 2026-07-01

## Categories

Documents tab now supports filters:

- Hợp đồng
- Bản vẽ
- Biện pháp thi công
- Nghiệm thu
- Biên bản
- Hình ảnh
- Khác

## Data Source

- Existing Attachments runtime rows from `GET /projects/runtime`.

## Rule

- No fake documents are generated.
- Unknown categories fall back to `Khác`.
