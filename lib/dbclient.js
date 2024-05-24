const MongoLeader = require('mongo-leader');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const Lock = require('redislock');

exports.connect = (server, options) => {

    if (options.lock.url.startsWith('mongodb')) {
        return MongoClient.connect(options.lock.url).then((db) => {

            const leader = new MongoLeader.Leader(db, {
                ttl: options.lock.ttl,
                wait: options.lock.retry,
                key: options.lock.key
            });
            server.decorate('server', 'leader', leader);
        });
    }
    else if (options.lock.url.startsWith('redis')) {
        const client = Redis.createClient(options.lock.url);

        const p = new Promise((resolve, reject) => {

            client.on('ready', () => {

                const leader = Lock.createLock(client, {
                    timeout: options.lock.ttl,
                    retries: 0,
                    delay: options.lock.retry
                });

                const isLeader = function () {

                    return new Promise((res, rej) => {

                        leader.acquire(options.lock.key, (err) => {

                            if (err) {
                                const locks = Lock.getAcquiredLocks();
                                if (locks && locks.length > 0) {
                                    return res(true);
                                }
                                return res(false); // 'Lock already held'
                            }
                            setTimeout(() => {

                                leader.release((err) => {

                                    if (err) {
                                        return console.log(err.message);
                                    } // 'Lock on app:lock has expired'
                                });
                            }, 1500);

                            return res(true);
                        });
                    });
                };

                leader.isLeader = isLeader;
                server.decorate('server', 'leader', leader);
                return resolve();
            });
        });

        return p;
    }
};
