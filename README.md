# Capistrano actions
Github deploy action for Capistrano. Use this action to automate your capistrano deployment process.

## Inputs
### `target`
Environment where deploy is to be performed to. E.g. "production", "staging". Default value is empty

### `deploy_key`
**Required** Symmetric key to decrypt private RSA key. Must be a string.

### `enc_rsa_key_pth`
**Required** Path to the encrypted key. Default `"config/deploy_id_rsa_enc"`.

## Outputs
No outputs

## Setting up CD using this action
1. Generate SSH keys on the target machine
```bash
$ ssh-keygen
```
2. Export public key to the `authorized_keys` to allow the usage of this keypair to login
```bash
$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```
3. Add public key from `~/.ssh/id_rsa.pub` to your repository's deployment keys via *Settings / Deploy keys / Add*
4. Encrypt your private key with a strong password. **Please use these options**, otherwise this action may not be able to decrypt your key.
```bash
$ openssl enc -aes-256-cbc -md sha512 -salt -in .ssh/id_rsa -out deploy_id_rsa_enc -k PASSWORD -a
```
5. Add `deploy_id_rsa_enc` file to your repository. Suggested path is `config/deploy_id_rsa_enc`
6. Save the password used in step 4 as a secret in repository settings via *Settings / Secrets / Add*
7. Create YAML configuration for your workflow (example below)

## Workflow example
```yaml
name: deploy_production

on:
  push:
    branches: 
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses: miloserdow/capistrano-deploy@v1.3
      with:
        target: 'production'
        deploy_key: ${{ secrets.DEPLOY_ENC_KEY }}
```
