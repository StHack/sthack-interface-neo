# sthack-interface

## Version 2.0

- to regenerate https certificate : `docker-compose build --no-cache reverse-proxy`

## Introduction

The NodeJS interface for St'Hack CTF game.
More information on the  event : <https://www.sthack.fr/>

## Installation

You need nodejs with npm, bower, and grunt.

```bash
git clone https://github.com/agix/sthack-interface-neo
cd sthack-interface-neo
npm install
bower install
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt
```

You need to create a `sshProduction.json` file to use the deploy procedure (see later).

```json
{
    "host"          : "production_host",
    "username"      : "ssh user",
    "password"      : "ssh password",
    "path"          : "path to scp",
    "extractcmd"    : "extract the tar.gz in your prod directory",
    "restartcmd"    : "restart your service",
    "startcmd"      : "start your service"
}
```

### Mongodb

You just need to manually create your first admin user.

```bash
$ mongo sthack
MongoDB shell version: 2.4.6
connecting to: sthack
> db.teams.insert({'name':'admin','password':'2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'})
```

To reset scoreboard :

```js
db.tasks.update({'solved':{'$exists':true}},{'$unset':{'solved':''}},{upsert:false, multi:true});
```

To reset messages :

```js
db.messages.remove();
```

To reset teams :

```js
db.teams.remove({'name':{$ne:'admin'}});
```

## Run

Edit all RUNNING variable from Gruntfile.js.

```bash
grunt
```

Enjoy !

## Deploy procedure

You just need nodejs a mongodb server obviously and a redis server.

We need 2 simple users :

`sthackuser` with read write access to /var/www

`sthackapp` with read access to /var/www

Create the init script with your config env.

```bash
description "Sthack scoreboard"

start on runlevel [2345]

setuid sthackapp
setgid sthackapp

chdir /var/www/

env PORT=443
export PORT
env CERT_PATH="server.crt"
export CERT_PATH
env KEY_PATH="server.key"
export KEY_PATH
env ADMIN_NAME="admin"
export ADMIN_NAME
env CLOSED_TASK_DELAY=0
export CLOSED_TASK_DELAY
env SESSION_SECRET="randomstring"
export SESSION_SECRET
env DB_CONNECTION_STRING="mongodb://user:pass@ip:port/db"
export DB_CONNECTION_STRING
env REDIS_HOST="ip"
export REDIS_HOST
env REDIS_PORT=port
export REDIS_PORT
env SESSION_KEY="sthackSession"
export SESSION_KEY
env ADMIN_PATH="/admin"
export ADMIN_PATH
env TITLE="Sthack"
export TITLE
env BASE_SCORE=50
export BASE_SCORE
env NODE_ENV="production"
export NODE_ENV

#expect fork

respawn

exec /usr/bin/nodejs /var/www/server.js
```

Add `sthackuser` in sudoers.

`/etc/sudoers.d/sthack`

```bash
sthackuser ALL = (root) NOPASSWD: /sbin/start sthack, /sbin/stop sthack, /sbin/restart sthack, /sbin/status sthack
```

`sshProduction.json` example

```json
{
    "host"          : "10.13.37.100",
    "username"      : "sthackuser",
    "password"      : "sthackuserpass",
    "path"          : "/home/sthackuser",
    "extractcmd"    : "tar xvzf /home/sthackuser/sthack-interface-neo.tar.gz -C /var/www/ && cd /var/www && npm update --production && chmod -R o+r /var/www/",
    "restartcmd"    : "sudo sthack restart",
    "startcmd"      : "sudo sthack start"
}
```

From your dev computer type `grunt deploy`
