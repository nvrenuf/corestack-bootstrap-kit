SHELL := /usr/bin/env bash

.PHONY: lint fmt test smoke tool-system-test mvp-validation

lint:
	./tests/shellcheck.sh
	./tests/yamllint.sh

fmt:
	./tests/shfmt.sh

test: lint
	./tests/smoke_granite.sh

smoke:
	./tests/smoke_granite.sh


tool-system-test:
	./scripts/tool-system/test.sh


mvp-validation:
	./scripts/tool-system/validate-mvp-slice.sh
