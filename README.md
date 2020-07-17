LDAP user login check for Node-RED
=========


node-red-contrib-ldap-login is a [Node-RED](https://nodered.org/) node for Microsoft Active Directory. It is based on the [ldapjs](https://www.npmjs.com/package/ldapjs) ldapjs client for auth (authentication) and authZ (authorization) for Microsoft Active Directory.

If you want to contribute in order to add brand new features and/or nodes, do not hesitate to join and submit your merge requests!

Getting started
--------------

1. Install Node-RED ([more](https://nodered.org/docs/getting-started/installation)):
```sh
sudo npm install -g node-red
```
2. Go to your node-RED conf directory (basically `~/.node-red`)
```sh
npm install node-red-contrib-ldap-login
```
3. There you go! You can run Node-RED with:
```sh
node-red
```

Documentation
--------------
+ [Connection](#connection)
+ [login](#login)

---------------------------------------

<a id="connection"></a>
### Connection

Every node requires LDAP configuration/credentials to create an instance of the client configured according to the following options:
+ `url` {string}: Active Directory server to connect to, e.g. `ldap://ad.example.com`.
+ `[baseDN]` {string}: Optional, The root DN from which all searches will be performed, e.g. `dc=example,dc=com`.

+ `username` {string}: An account name to check.
+ `password` {string}: Password for the given `username`.

![image of node credentials](images/node_credentials.png)

<a id="login"></a>
### login

![image of node finduser](images/node_finduser.png)

Connects to a Microsoft Active Directory and returns the user corresponding to the username/DN set in `msg.payload`.

__Inputs__

+ `msg.payload` {JSON Object}: the AD username and password of the user we want to get information. It also works with DN.
        payload.username - username in format username@domain.com
        payload.password - password for username
+ `msg.ad_attributes` {JSON Object}: the attributes we want to return for users and groups. By default:
```json
{
  "user": [
      "dn", "distinguishedName",
      "userPrincipalName", "sAMAccountName", "mail",
      "lockoutTime", "whenCreated", "pwdLastSet", "userAccountControl",
      "employeeID", "sn", "givenName", "initials", "cn", "displayName",
      "comment", "description", "url"
  ],
  "group": [
      "dn", "cn", "description", "distinguishedName", "objectCategory"
  ]
}
```
+ `msg.tlsOptions` {JSON Object}: (Optional) Additional options passed to TLS connection layer when connecting via ldaps://. (See: [TLS docs for node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback)).

__Outputs__

+ `msg.payload` {JSON Object}: the standard output of the command, a JSON object that contains all the information about the user.

