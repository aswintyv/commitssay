const cheerio = require('cheerio');
const request = require("request");
const Datastore = require('nedb')
const fs = require('fs');
const db = new Datastore({ filename: 'dataFile', autoload: true });
const _ = require('lodash');
const cowsay = require("cowsay");


var geeksayModule = function() {
    this.init = () => {
        db.count({}, (err, count) => {

            var stats = fs.statSync("dataFile");
            var mtime = new Date(stats.mtime).getTime();
            var currtime = new Date().getTime();
            if (currtime - mtime > 24 * 60 * 60 * 100 || count === 0) {
                this.do_api();
            }
            else if (count > 1000) {
                this.clear_db_and_restart();
            }
            else {
                this.echo_from_db();
            }
        });
    }

    this.clear_db_and_restart = () => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            this.do_api();
        });
    }

    this.echo_from_db = () => {
        db.count({}, (err, count) => {
            var rand = Math.floor((Math.random() * count) + 1);
            db.findOne({ id: rand }, (err, doc) => {
                if (doc) {
                    console.log(cowsay.think({
                        text: doc.message + "\n           -" + doc.commiter,
                        e: "oO",
                        T: "U "
                    }));
                }
                else {
                    console.log(cowsay.think({
                        text: "Sometimes it's okay to not say anything.",
                        e: "oO",
                        T: "U "
                    }));
                }
            });
        });
    }


    this.do_api = () => {
        db.count({}, (err, count) =>  {
            request({ url: 'http://www.commitlogsfromlastnight.com/' }, () =>  {
                var html = arguments[2];
                var $ = cheerio.load(html);
                var logs = $('.post');
                var docs = [];
                _.each(logs, (log, i) => {
                    var message = $(log).find('.message a').html();
                    var commiter = $(log).find('.commiter').html();
                    docs.push({ message: message, commiter: commiter, id: count + i });
                });
                db.insert(docs, (err, newDocs) => {
                    echo_from_db();
                });

            })
        });
    }

    this.init();
}

module.exports = geeksayModule;


