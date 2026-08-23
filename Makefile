.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help install dev build preview test test-watch typecheck validate snippets docker-up docker-down docker-build clean

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости (npm install)
	npm install

dev: ## Запустить dev-сервер VitePress
	npm run dev

build: ## Собрать продакшен-сборку
	npm run build

preview: ## Предпросмотр собранного сайта
	npm run preview

test: ## Запустить тесты (vitest)
	npm test

test-watch: ## Запустить тесты в watch-режиме
	npm run test:watch

typecheck: ## Проверить типы (vue-tsc)
	npm run typecheck

validate: ## Валидировать сниппеты
	npm run snippets:validate

snippets: ## Список сниппетов
	npm run snippets:list

docker-up: ## Запустить dev-окружение в Docker
	env UID=$$(id -u) GID=$$(id -g) docker compose up -d

docker-down: ## Остановить Docker-окружение
	docker compose down

docker-build: ## Собрать Docker-образ
	env UID=$$(id -u) GID=$$(id -g) docker compose build

clean: ## Удалить node_modules и результаты сборки
	rm -rf node_modules docs/.vitepress/dist docs/.vitepress/cache
