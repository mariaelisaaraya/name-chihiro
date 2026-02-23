.PHONY: dev test circuits contracts demo prove-server prove install

install:
	pnpm install

dev:
	pnpm dev

test:
	cd gitBDB && npm run test

circuits:
	cd gitBDB-circuits/chihiro-name && nargo compile && nargo test

contracts:
	cd gitBDB-contracts && cargo test

prove-server:
	cd gitBDB && node scripts/prove-server.js

prove:
	cd gitBDB && ./scripts/prove.sh $(SECRET) $(SALT)

demo:
	./scripts/demo.sh all
