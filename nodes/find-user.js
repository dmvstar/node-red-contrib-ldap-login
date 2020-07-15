var mustache = require('mustache');

module.exports = function (RED) {
  function loginUserNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    // we get the properties
    node.url = config.url;
    node.baseDN = config.baseDN;
    node.filter = config.filter;
    node.attributes = config.attributes;
    
    // we get the credentials
    var cUsername = this.credentials.username;
    var cPassword = this.credentials.password;
    var fUsername;


    node.on("input", function (msg) {
      node.status({
        fill: "blue",
        shape: "ring",
        text: "connecting"
      });
      // import ldapjs
      var ldap = require("ldapjs");

      if (msg.payload.username) fUsername = msg.payload.username;

      var adConfig = {
        url: node.url,
        baseDN: node.baseDN,
        username: cUsername,
        password: cPassword
      };

      // set attributes if defined
      if (msg.ad_attributes) {
        // Validates the Object format (required for IBMi platform)
        adConfig.attributes = JSON.parse(JSON.stringify(msg.ad_attributes));
      }
      if (msg.tlsOptions) {
        // Validates the Object format (required for IBMi platform)
        adConfig.tlsOptions = JSON.parse(JSON.stringify(msg.tlsOptions));
      }

      try {

        var isTemplatedUrl = (node.filter || "").indexOf("{{") != -1;
        var attributes = node.attributes.replace(/ /g, '').split(",");

        if (isTemplatedUrl) {
          node.filter = '' + mustache.render(node.filter, msg);
        }

        console.log(node.filter);
        var opts = {
          filter: node.filter, //'(&(objectCategory=Person)(objectClass=User)(samaccountname=' + fUsername + '))',
          scope: 'sub',
          attributes: attributes, //['objectGUID', 'emailAddress', 'departmentNumber', 'title', 'userPrincipalName', 'memberOf', 'sn', 'givenName', 'mail']
        };
/*
        console.log('--------------------------------------');
        console.log(node.baseDN);
        console.log(node.filter);
        console.log(attributes);
        console.log(opts);
        console.log('--------------------------------------');
*/
        var client = ldap.createClient({
          url: node.url,
          timeout: 5000,
          connectTimeout: 10000
        });
        node.status({
          fill: "green",
          shape: "dot",
          text: "connected"
        });

        client.bind(cUsername, cPassword, function (error) {
          //console.log('--- try to bind --- ['+username+']');
          node.status({
            fill: "blue",
            shape: "ring",
            text: "querying"
          });

          if (error) {
            //console.log(error.message);
            client.unbind(function (error) {
              //if (error) { console.log(error.message);} else{console.log('1 client disconnected');}
            });
            node.status({
              fill: "red",
              shape: "dot",
              text: "login error"
            });

            msg.payload = { user: cUsername, login: false, message: error.message };
            node.send(msg);
            //node.error('ERROR login: ' + error.message);
          } else {
            //console.log('connected');
            node.status({
              fill: "green",
              shape: "dot",
              text: "search"
            });

            client.search(node.baseDN /*'dc=ukrgas, dc=bank, dc=local'*/, opts, function (error, search) {
/*              
              console.log('Searching.....');
              console.log(node.baseDN);
              console.log(opts);
*/
              search.on('searchEntry', function (entry) {
                if (entry.object) {
                  console.log('entry: %j ' + JSON.stringify(entry.object));
                  msg.payload = { user: fUsername, find: true, message: entry.object };
                  node.send(msg);
                } else {
                  msg.payload = { user: fUsername, find: false, message: "No object" };
                  node.send(msg);
                }
                client.unbind( function (error) {
                  //if (error) console.log(error.message); else  console.log('1 client disconnected');
                });
              });

              search.on('error', function (error) {
                console.error('error: ' + error.message);
                client.unbind( function (error) {
                  //if (error) console.log(error.message); else  console.log('1 client disconnected');
                });
                msg.payload = { user: fUsername, find: false, message: "Search Error " + error.message };
                node.send(msg);
              });

            });

          }
        });
      } catch (e) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "connexion error"
        });
        node.error("ERROR connecting: " + e.message);
      }
    });
  }

  RED.nodes.registerType("find-user", loginUserNode, {
    credentials: {
      username: {
        type: "text"
      },
      password: {
        type: "password"
      }
    }
  });
};
