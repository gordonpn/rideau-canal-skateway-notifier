dir_name := $(shell basename $(CURDIR))
username := gordonpn

.PHONY: build-docker
build-docker:
	docker build -t rideau-canal-skateway-notifier .

.PHONY: run-docker
run-docker:
	docker run rideau-canal-skateway-notifier

.PHONY: sync
sync: ## start sync unidirectionally with dev server
	ssh $(username)@rpi3 mkdir -p /home/$(username)/dev-workspace/$(dir_name);
	rsync -chavzP --stats . $(username)@rpi3:dev-workspace/$(dir_name);
	fswatch -o . | while read f; do rsync -chavzP --stats . $(username)@rpi3:dev-workspace/$(dir_name); done
