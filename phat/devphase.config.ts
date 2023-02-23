import { ProjectConfigOptions } from 'devphase';
import { spawn } from 'child_process';
import * as fs from 'fs';

async function initChain(devphase: any): Promise<void> {
    console.log('######################## Initializing blockchain ########################');
    // Necessary to run; copied from devphase `defaultSetupenv()`
    devphase.mainClusterId = devphase.options.clusterId;
    // Run our custom init script
    return new Promise((resolve) => {
        const init = spawn(
            'node',
            ['src/setup-drivers.js'],
            {
                stdio: 'inherit',
                cwd: './setup',
                env: {
                    ...process.env,
                    'ENDPOINT': devphase.options.nodeUrl,
                    'WORKERS': devphase.options.workerUrl,
                    'GKS': devphase.options.workerUrl,
                },
            },
        );
        init.on('exit', code => {
            console.log('initChain script exited with code', code);
            resolve();
        });
    });
}

async function saveLog(devphase: any, outPath): Promise<void> {
    console.log('######################## Saving worker logs ########################');
    const logging = fs.createWriteStream(outPath, { flags: 'w' });
    await new Promise((resolve: (_: void) => void) => {
        const readLog = spawn(
            'node', ['src/read-log.js'],
            {
                cwd: './setup',
                env: {
                    ...process.env,
                    'ENDPOINT': devphase.options.nodeUrl,
                    'WORKERS': devphase.options.workerUrl,
                    'CLUSTER': devphase.options.clusterId,
                }
            }
        );
        readLog.stdout.pipe(logging);
        readLog.stderr.pipe(logging);
        readLog.on('exit', code => {
            console.log('saveLog script exited with code', code);
            resolve();
        });
    });
}

const config: ProjectConfigOptions = {
    /*
 * Project directories
 */
    directories: {
        artifacts: 'artifacts',
        contracts: 'contracts',
        logs: 'logs',
        stacks: 'stacks',
        tests: 'tests',
        typings: 'typings'
    },
    /*
     * Stack configuration
     * {
     *     [componentName : string]: {
     *          binary: string, // path to binary
     *          workingDir: string, // working directory as above
     *          evns: {
     *              [name: string]: string,
     *          },
     *          args: {
     *              [name: string]: string,
     *          },
     *          timeout: number // start up timeout
     *     }
     * }
     */
    stack: {
        blockTime: 500,
        version: 'nightly-2022-12-27',
        node: {
            port: 39944,
            binary: '{{directories.stacks}}/{{stack.version}}/phala-node',
            workingDir: '{{directories.stacks}}/.data/node',
            envs: {},
            args: {
                '--dev': true,
                '--port': 33333,
                '--rpc-port': 39933,
                '--ws-external': true,
                '--unsafe-ws-external': true,
                '--rpc-methods': 'Unsafe',
                '--block-millisecs': '{{stack.blockTime}}',
                '--ws-port': '{{stack.node.port}}',
            },
            timeout: 10000,
        },
        pruntime: {
            port: 38000, // server port
            binary: '{{directories.stacks}}/{{stack.version}}/pruntime',
            workingDir: '{{directories.stacks}}/.data/pruntime',
            envs: {
                'RUST_LOG': 'debug,runtime=trace'
            },
            args: {
                '--allow-cors': true,
                '--cores': 0,
                '--port': '{{stack.pruntime.port}}',
                '--address': '0.0.0.0',
            },
            timeout: 2000,
        },
        pherry: {
            gkMnemonic: '//Ferdie', // super user mnemonic
            binary: '{{directories.stacks}}/{{stack.version}}/pherry',
            workingDir: '{{directories.stacks}}/.data/pherry',
            envs: {},
            args: {
                '--no-wait': true,
                '--mnemonic': '{{stack.pherry.gkMnemonic}}',
                '--inject-key': '0000000000000000000000000000000000000000000000000000000000000001',
                '--substrate-ws-endpoint': 'ws://localhost:{{stack.node.port}}',
                '--pruntime-endpoint': 'http://localhost:{{stack.pruntime.port}}',
                '--dev-wait-block-ms': '{{stack.blockTime}}',
                '--attestation-provider': 'none',
            },
            timeout: 5000,
        }
    },
    /**
     * Testing configuration
     */
    testing: {
        mocha: {}, // custom mocha configuration
        envSetup: { // environment setup
            setup: {
                // custom setup procedure callback; (devPhase) => Promise<void>
                custom: initChain,
                timeout: 120 * 1000,
            },
            teardown: {
                // custom teardown procedure callback ; (devPhase) => Promise<void>
                custom: devphase =>
                    saveLog(devphase, `${devphase.runtimeContext.paths.currentLog}/worker.log`),
                timeout: 10 * 1000,
            }
        },
        blockTime: 500, // overrides block time specified in node (and pherry) component
        stackLogOutput: true, // if specifed pipes output of all stack component to file (by default it is ignored)
    },
    /**
     * Configuration options of DevPhase instance used in testing
     */
    devPhaseOptions: {
        nodeUrl: 'ws://localhost:{{stack.node.port}}',
        workerUrl: 'http://localhost:{{stack.pruntime.port}}',
        accountsMnemonic: '', // default account
        accountsPaths: {
            alice: '//Alice',
            bob: '//Bob',
            charlie: '//Charlie',
            dave: '//Dave',
            eve: '//Eve',
            ferdie: '//Ferdie',
        },
        sudoAccount: 'alice',
        ss58Prefix: 30,
        clusterId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
};

export default config;
