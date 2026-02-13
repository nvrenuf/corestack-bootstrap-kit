SHELL := /usr/bin/env bash

.PHONY: lint fmt test smoke

lint:
	./tests/shellcheck.sh
	./tests/yamllint.sh

fmt:
	./tests/shfmt.sh

test: lint
	./tests/smoke_granite.sh

smoke:
	./tests/smoke_granite.sh
