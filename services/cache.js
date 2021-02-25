const mongoose = require('mongoose');
const keys = require('../config/keys');
//Redis setup
const { promisify } = require('util');
const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
//const redisPort = 6379;
const client = redis.createClient(keys.redisUrl || keys.redisPort);

//client.get = promisify(client.get).bind(client);
//const getAsync = promisify(client.get).bind(client);
//
['hget', 'hset'].forEach(
    k => {
      client[`${k}Async`] = promisify(client[k]).bind(client);
    }
  );


const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.applyCache = function(options = {}) {
    this.applyCaching = true;
    this._hashKey = JSON.stringify(options.key || '');
    return this;
}

mongoose.Query.prototype.exec = async function() {    

    if(!this.applyCaching) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify({...this.getFilter(), collection: this.mongooseCollection.name });

    const cachedValues = await client.hgetAsync(this._hashKey, key);
        
    if(cachedValues) {
        console.log("FROM CACHE");
        const doc = JSON.parse(cachedValues);

        return Array.isArray(doc) 
                ? doc.map(iDoc => new this.model(iDoc))
                : new this.model(doc) 
    }

    
    //console.log("CACHED ---> ", cachedValues);


    const result = await exec.apply(this, arguments);
    console.log("FROM DB");
    client.hsetAsync(this._hashKey, key, JSON.stringify(result));

    return result;
}

module.exports = {
    clearHash: function(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}