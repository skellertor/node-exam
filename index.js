/*******************************************
 * Main entry point for x-teams' node-exam *
 *******************************************/
'use strict';

const path = require('path');
const lib = require('./lib/functions');
let args = process.argv;

/***********************************************************************************************************
 * Now entering callback hell.... promises would resolve this but directions explicitly said use callbacks *
 ***********************************************************************************************************/

let finalTime = function () {
    console.timeEnd('benchmark');
};
console.time('benchmark');

// 1. See if there are results cached
lib.getCached(path.join(__dirname, 'cached', 'cached.json'), function (err, cached) {
    if(err){
        // 2. Gets all filenames in data directory
        lib.getFileNames(path.join(__dirname, 'data'), function (filenames) {
            // 3. Reads all files in data directory and returns only the tags
            lib.getTags(filenames, function (tags) {
                // 4. Gets totals for all tags
                lib.countTags(tags, function (countedTags) {
                    //5. Cache the results for future querys
                    lib.cacheResults(countedTags, path.join(__dirname, 'cached'), function () {
                        // 6. Grabs the args from the CLI or uses default `tags.txt` if none provided
                        lib.getArgs(args, path.join(__dirname, 'tags.txt'), function (finalArgs, longestArg) {
                            // 7. Match tags and sort in descending order
                            lib.matchSort(finalArgs, countedTags, function (sorted) {
                                // 8. Prints final results
                                lib.printFormatted(sorted, longestArg, finalTime)
                            });
                        });
                    });
                })
            });
        });
    } else {
        lib.getArgs(args, path.join(__dirname, 'tags.txt'), function (finalArgs, longestArg) {
            lib.matchSort(finalArgs, cached, function (sorted) {
                lib.printFormatted(sorted, longestArg, finalTime)
            });
        });
    }
});
