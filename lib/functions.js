/***********************************************
 * Asynchronous library for x-teams' node-exam *
 ***********************************************/
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Returns cached results if exists
 *
 * @param path - string
 * @param callback - function
 */
module.exports.getCached = function (path, callback) {
    fs.readFile(path, function (err, data) {
        if(err){
            callback(err, {});
        } else {
            callback(err, JSON.parse(data));
        }
    })
};

/**
 * Returns absolute paths for all files in the data directory
 *
 * @param directory - string
 * @param callback - function
 */
module.exports.getFileNames = function (directory, callback) {
    fs.readdir(directory, function (err, files) {
        let filenames = files.map(function (name) {
            return path.join(directory, name);
        });
        callback(filenames);
    });
};

/**
 * Reads all JSON files and gets all `tags` arrays.
 * Piggy backs off JSON.parse reviver parameter to extract tags
 * instead of having to traverse the json object later.
 *
 * @param files - array
 * @param callback - function
 */
module.exports.getTags = function (files, callback) {
    let tags = [],
        n = files.length,
        acc = 0;

    files.forEach(function (filename) {
        (function (name) {
            fs.readFile(name, function (err, data) {
                acc++;
                try {
                    JSON.parse(data, function (key, value) {
                        if(typeof value === 'object' && key === 'tags'){
                            if(value) {
                                value.forEach(function (item) {
                                    tags.push(item);
                                });
                            }
                            return value;
                        } else {
                            return value;
                        }
                    });
                } catch(err) {
                    console.error(err);
                }
                if(acc === n){
                    callback(tags);
                }
            })
        })(filename);
    });
};

/**
 * Takes an array of all the tags and counts them, returns object
 *
 * @param tags - array
 * @param callback - function
 */
module.exports.countTags = function (tags, callback) {
    let countedTags = {};
    tags.forEach(function (tag) {
        if(countedTags.hasOwnProperty(tag)){
            countedTags[tag] += 1;
        } else {
            countedTags[tag] = 1;
        }
    });
    callback(countedTags);
};

/**
 * Caches results of counting tags
 *
 * @param countedTags - object
 * @param directory - string
 * @param callback - function
 */
module.exports.cacheResults = function (countedTags, directory, callback) {
    fs.writeFile(path.join(directory, 'cached.json'), JSON.stringify(countedTags), function (err) {
        callback();
    });
};

/**
 * Returns command line arguments if supplied, otherwise uses `tags.txt`
 *
 * @param args - array
 * @param filepath - string
 * @param callback - function
 */
module.exports.getArgs = function (args, filepath, callback) {
    if(args.length > 2){
        let tags = args[2],
            splitArgs = tags.split(','),
            longestArg = 0;
        let finalArgs = splitArgs.filter(function (tag) {
            if(tag.length > longestArg){
                longestArg = tag.length;
            }
            return tag;
        });
        callback(finalArgs, longestArg);
    } else {
        fs.readFile(filepath, function (err, data) {
            let longestArg = 0;
            let defaultargs = data.toString().split(/\n|\r\n/);
            let finalArgs = defaultargs.filter(function (item) {
                (item.length > longestArg) ? longestArg = item.length: '';
                return item;
            });
            callback(finalArgs, longestArg);
        });
    }
};

/**
 * Matches args with matching tags and returns sorted object
 *
 * @param finalArgs - array
 * @param countedTags - object
 * @param callback - function
 */
module.exports.matchSort = function (finalArgs, countedTags, callback) {
    let final = finalArgs.map(function (item) {
        let obj = {};
        if (countedTags.hasOwnProperty(item)) {
            obj[item] = countedTags[item]
        } else {
            obj[item] = 0
        }
        return obj;
    });
    let sorted = final.sort(function (a, b) {
        let first = a[Object.keys(a)[0]];
        let second = b[Object.keys(b)[0]];
        return second - first;
    });
    callback(sorted);
};

/**
 * Formats and prints final result
 *
 * @param sorted - object
 * @param longestArg - number
 * @param callback - function
 */
module.exports.printFormatted = function (sorted, longestArg, callback) {
    let getSpaces = function(tag, longest) {
        let spaces = '',
            diff = longest - tag;
        for(let i = 0; i < diff; i++){
            spaces += ' ';
        }
        spaces += '\t';
        return spaces;
    };
    for (let item of sorted) {
        let key = Object.keys(item)[0];
        let val = item[Object.keys(item)];
        console.log('%s%s%d', key, getSpaces(key.length, longestArg), val);
    }
    callback();
};