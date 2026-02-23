# Noir Circuits

This directory contains the zero-knowledge proof circuits written in Noir for Chihiro's Lost Name.

## Circuits

### chihiro-name/

Main circuit for proving knowledge of a secret name without revealing it. Uses Poseidon2 hash for commitments.

**Inputs:**
- `name_secret`: The secret name (private input)
- `salt_hex`: Random salt for commitment (private input)
- `commit`: Expected Poseidon2 hash (public output)

## Development

```bash
# Compile circuit
cd chihiro-name
nargo compile

# Run tests
nargo test

# Generate proof (requires bb CLI)
nargo prove
```

## Requirements

- Noir v0.33.0+
- Barretenberg backend for UltraHonk proofs
