module.exports = function(RED) {
  function loginUserNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    // we get the properties
    node.url = config.url;
    node.baseDN = config.baseDN;
    // we get the credentials
    var cUsername = this.credentials.username;
    var cPassword = this.credentials.password;

    node.on("input", function(msg) {
      node.status({
        fill: "blue",
        shape: "ring",
        text: "connecting"
      });
      // import ldapjs
      var ldap = require("ldapjs");

      if (msg.payload.username) cUsername = msg.payload.username;
      if (msg.payload.password) cPassword = msg.payload.password;

      //console.log('['+cUsername+']['+cPassword+']');

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

        client.bind(cUsername, cPassword, function(error) {
          //console.log('--- try to bind --- ['+username+']');
          node.status({
            fill: "blue",
            shape: "ring",
            text: "querying"
          });

          if (error) {
            //console.log(error.message);
            client.unbind(function(error) {
              if (error) {
                //console.log(error.message);} else{console.log('1 client disconnected');
              }
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
              text: "login"
            });
            client.unbind(function(error) {
              if (error) {
                //console.log(error.message);} else{console.log('1 client disconnected');
              }
            });
            msg.payload = { user: cUsername, login: true, message: '' };
            node.send(msg);
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

  RED.nodes.registerType("login-user", loginUserNode, {
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
