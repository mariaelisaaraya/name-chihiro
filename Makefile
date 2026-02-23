.PHONY: dev test circuits contracts demo prove-server prove

dev:
	cd gitBDB && npm install && npm run dev

test:
	cd gitBDB && npm run test

circuits:
	cd gitBDB-circuits/chihiro-name && nargo compile && nargo test

contracts:
	cd gitBDB-contracts && cargo test

# Servidor local de proof (puerto 4001) — ejecutar en terminal separada.
# Los scripts viven en gitBDB/scripts/ para que Node resuelva
# @aztec/bb.js y @noir-lang/* desde gitBDB/node_modules/ (resolución correcta).
prove-server:
	cd gitBDB && node scripts/prove-server.js

# Generar proof desde CLI (requiere nargo + bb instalados en PATH).
# Uso: make prove SECRET=chihiro SALT=0x1234abcd
prove:
	cd gitBDB && ./scripts/prove.sh $(SECRET) $(SALT)

demo:
	./scripts/demo.sh all
