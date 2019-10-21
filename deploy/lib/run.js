"use strict";

// took some code from https://github.com/Azure/k8s-actions
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


// no idea what this does
Object.defineProperty(exports, "__esModule", { value: true });

const toolCache = require("@actions/tool-cache");
const core = require("@actions/core");
const io = require("@actions/io");
const toolrunner = require("@actions/exec/lib/toolrunner");
const path = require("path");
const fs = require("fs");

function install_deps() {
    return __awaiter(this, void 0, void 0, function* () {
        // Install Xcode for Mac OS
        if (process.platform == 'darwin') {
            let runner_ = new toolrunner.ToolRunner('xcode-select',  ['--install']);
            runner_.exec();
        } else {
            let runner_ = new toolrunner.ToolRunner('sudo',  
                ['apt-get', 'install', 'ruby-full', 'build-essential', 'postgresql', 'libpq-dev']);
           yield runner_.exec();
        }  
        
        // WORKAROUND, TODO: Parse version from Gemfile
        let runner = null;
        if (process.platform == 'darwin') {
            runner = new toolrunner.ToolRunner('gem', 
                ['install', 'bundler:1.17.2']);
        } else {
            runner = new toolrunner.ToolRunner('sudo', 
                ['gem', 'install', 'bundler:1.17.2']);
        }
        yield runner.exec();
        
        //let runner0 = new toolrunner.ToolRunner('gem', ['install', 'capistrano', 'capistrano-rails']);
        //yield runner0.exec();
        
        //let runner1 = new toolrunner.ToolRunner('bundle', ['update', '--bundler']);
        //yield runner1.exec();
        
        let runner2 = null;
        if (process.platform == 'darwin') { 
            runner2 = new toolrunner.ToolRunner('bundle', ['install', '--deployment']);
        } else {
            runner2 = new toolrunner.ToolRunner('sudo', ['bundle', 'install', '--deployment']);
        }
        yield runner2.exec();
    });
}

function decrypt_key(deploy_key, enc_rsa_key_pth) {
  return __awaiter(this, void 0, void 0, function* () {
    // Create directory if not exists
    yield io.mkdirP('config');
    
    let runner0 = new toolrunner.ToolRunner('openssl', ['version']);
    yield runner0.exec();

    // TODO: also check that the key is valid after decryption
    let runner = new toolrunner.ToolRunner('openssl', 
        ['enc', '-d', '-aes-256-cbc', '-md', 'sha512', '-salt', '-in', 
         enc_rsa_key_pth, '-out', 'config/deploy_id_rsa', '-k', deploy_key, '-a']);
    yield runner.exec();
  });
}

function deploy(target) {
    return __awaiter(this, void 0, void 0, function* () {
        let args = [];
        if (!target) {
          args = ['exec', 'cap', 'deploy'];
        } else {
          args = ['exec', 'cap', target, 'deploy'];
        }
        let runner = new toolrunner.ToolRunner('bundle', args);
        yield runner.exec();
    });
}

function run() {
  return __awaiter(this, void 0, void 0, function* () {
    let target = core.getInput('target');
    let deploy_key = core.getInput('deploy_key');
    let enc_rsa_key_pth = core.getInput('enc_rsa_key_pth');
    
    if (!deploy_key) {
      core.setFailed('No deploy key given');
    }
    
    // TODO: also check that the file exists 
    if (!enc_rsa_key_pth) {
      core.setFailed('Encrypted RSA private key undefined');
    }
    
    yield install_deps();
    yield decrypt_key(deploy_key, enc_rsa_key_pth);
    yield deploy(target);
  });
}

run().catch(core.setFailed);
