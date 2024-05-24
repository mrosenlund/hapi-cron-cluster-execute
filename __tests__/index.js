/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const HapiCron = require('../lib');
const Hapi = require('hapi');
const Shot = require('shot');


/*********************************************************************************
 2. Exports
 *********************************************************************************/

describe('registration assertions', () => {

    it('should register plugin without errors', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                }
            }
        });
    });

    it('should throw error when a job is defined with an existing name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }, {
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Job name has already been defined');
        }
    });

    it('should throw error when a job is defined without a name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job name');
        }
    });

    it('should throw error when a job is defined without a time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time');
        }
    });

    it('should throw error when a job is defined with an invalid time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: 'invalid cron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Time is not a cron expression');
        }
    });

    it('should throw error when a job is defined with an invalid timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'invalid',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Invalid timezone. See https://momentjs.com/timezone for valid timezones');
        }
    });

    it('should throw error when a job is defined without a timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time zone');
        }
    });

    it('should throw error when a job is defined without a request or execute option', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request options or execute function');
        }
    });

    it('should throw error when a job is defined without a request object', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request url');
        }
    });
});

describe('plugin functionality', () => {

    it('should expose access to the registered jobs', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });
        expect(server.plugins['hapi-cron-cluster']).toBeDefined();
        expect(server.plugins['hapi-cron-cluster'].jobs.testcron).toBeDefined();
    });

    it('should ensure server.inject is called with the plugin options', async () => {

        const onComplete = jest.fn();
        const server = new Hapi.Server();

        Shot.inject = jest.fn(Shot.inject);

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/3 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    onComplete
                }]
            }
        });
        await server.start();

        expect(Shot.inject).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();
        await new Promise((resolve, reject) => {

            setTimeout(async () => {

                expect(onComplete).toHaveBeenCalledTimes(1);
                expect(Shot.inject.mock.calls[0][1].method).toBe('GET');
                expect(Shot.inject.mock.calls[0][1].url).toBe('/test-url');
                await server.stop();
                resolve();
            }, 3200);
        });

    });

    it('should ensure server.inject is called with the plugin options, REDIS Engine', async () => {

        const onComplete = jest.fn();
        const server = new Hapi.Server();

        Shot.inject = jest.fn(Shot.inject);

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'redis://localhost',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/3 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    onComplete
                }]
            }
        });
        await server.start();

        expect(Shot.inject).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();
        await new Promise((resolve, reject) => {

            setTimeout(async () => {

                expect(onComplete).toHaveBeenCalledTimes(1);
                expect(Shot.inject.mock.calls[0][1].method).toBe('GET');
                expect(Shot.inject.mock.calls[0][1].url).toBe('/test-url');
                await server.stop();
                resolve();
            }, 3200);
        });

    });

    it('should not start the jobs until the server starts', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBeUndefined();

        await server.start();

        expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(true);

        await server.stop();
    });

    it('should stop cron jobs when the server stops', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        await server.start();

        expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(true);

        await server.stop();

        expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(false);
    });
});
