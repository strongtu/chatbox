# Makefile for Chatbox web (Linux/WSL)
# 后台启动 web 服务，SSH 断开后进程仍保留

SHELL     := /bin/sh
WEB_PORT  ?= 3000
LOG_FILE  := run.log

.PHONY: help start-web restart-web stop-web

.DEFAULT_GOAL := help

help:
	@echo.
	@echo   Chatbox Web (Linux/WSL)
	@echo   =======================
	@echo.
	@echo   make start-web    Start web serve in background (survives SSH disconnect)
	@echo   make restart-web  Stop process on port $(WEB_PORT), then start web in background
	@echo   make stop-web     Stop process using port $(WEB_PORT)
	@echo.
	@echo   Requires: pnpm, build first with pnpm run build:web
	@echo   Log: $(LOG_FILE)
	@echo.

# Start web: run serve in background with nohup
start-web:
	@if [ ! -d release/app/dist/renderer ]; then \
		echo "[start-web] Not built. Run: pnpm run build:web"; exit 1; fi
	@if fuser $(WEB_PORT)/tcp >/dev/null 2>&1; then \
		echo "[start-web] Port $(WEB_PORT) in use. Use: make restart-web or make stop-web"; exit 1; fi
	nohup pnpm run serve:web >> $(LOG_FILE) 2>&1 &
	@echo [start-web] Web started in background, port $(WEB_PORT), log: $(LOG_FILE)

# Restart: kill port then start
restart-web: stop-web
	@sleep 2
	@if fuser $(WEB_PORT)/tcp >/dev/null 2>&1; then \
		fuser -k $(WEB_PORT)/tcp >/dev/null 2>&1; sleep 2; fi
	@if fuser $(WEB_PORT)/tcp >/dev/null 2>&1; then \
		echo "[restart-web] ERROR: port $(WEB_PORT) still in use"; exit 1; fi
	@$(MAKE) start-web

# Stop: kill process using WEB_PORT
stop-web:
	@fuser -k $(WEB_PORT)/tcp >/dev/null 2>&1 || true
	@echo [stop-web] Port $(WEB_PORT) released
