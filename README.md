sthack-interface
================

Introduction
--------------------
The NodeJS interface for St'Hack CTF game.
More information on the  event : https://www.sthack.fr/

Installation
--------------------
You need nodejs with npm bower and grunt.

```
$ git clone https://github.com/agix/sthack-interface-neo
$ cd sthack-interface-neo
$ npm install
$ bower install
$ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt
```

You need to create a sshProduction.json file to use the deploy procedure (see later).

```
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

```
$ grunt build
```

Mongodb
--------------------
You just need to manually create your first admin user.
```
$ mongo sthack
MongoDB shell version: 2.4.6
connecting to: sthack
> db.teams.insert({'name':'admin','password':'2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'})
```

To reset scoreboard :

```
db.tasks.update({'solved':{'$exists':true}},{'$unset':{'solved':''}},{upsert:false},{multi:true});
```

Run
--------------------
Edit all RUNNING variable from Gruntfile.js.

```
$ grunt
```
Enjoy !
