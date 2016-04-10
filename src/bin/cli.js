#! /usr/bin/env node

/* eslint-disable */

import path from 'path';
import chalk from 'chalk';
import packageInfo from 'package-info';
import ora from 'ora';
import _ from 'lodash';
import fs from 'fs';
import json2xls from 'json2xls';

const argv = require('yargs').argv;

const format = argv.format === 'xls' ? 'xls' : 'json';
const reportFileName = argv.reportFileName ? argv.reportFileName : 'deps-info-report';

import { callAsync } from '../utils';
import getPackages from '../getPackages';

function loadConfig() {

    let packageFiles = [];

    // Loading `deps-info.json` from the current directory
    const depsInfoFile = path.resolve('./deps-info.json');
    let depsInfo;
    try {
        depsInfo = require(depsInfoFile);
    } catch (error) {
        packageFiles = [];
        // do nothing
    }

    if (depsInfo) {
        console.log(chalk.green('Loading info from deps-info.json...'));
        try {
            packageFiles = depsInfo.map((pathToFile) => {
                return require(path.resolve(pathToFile));
            });
        } catch (error) {
            console.error(chalk.red(
                `Error deps-info.json: ${error.message}`
            ));
            throw new Error(error.message);
        }
    } else {
        console.log(chalk.green('Loading info from package.json...'));
        const packageFile = path.resolve('./package.json');
        let packageJson;
        try {
            packageJson = require(packageFile);
            packageFiles = [ packageJson ];
        } catch (error) {
            console.error(chalk.red(
                `Error loading package.json: ${error.message}`
            ));
            throw new Error(error.message);
        }
    }

    return packageFiles;
}

(async function main() {

    let files = [];

    try {
        files = loadConfig();
    } catch (error) {
        process.exit(0);
    }

    const dictionary = getPackages(files);
    const deps = _.values(dictionary);

    let results = [];
    const errors = [];

    const spinner = ora('Fetching info...');
    spinner.start();

    for (let i = 0; i < deps.length; i++) {
        try {
            spinner.text = `Fetching information about ${chalk.blue(deps[i].name)}`;
            const info = await callAsync(packageInfo, deps[i].name);
            results.push({
                ...deps[i],
                license: info.license,
                description: info.description,
                homepage: info.homepage
            });
        } catch (error) {
            errors.push(deps[i]);
        }
    }

    results = results.map((result) => {
        if (_.isArray(result.version)) {
            result.version = _.uniq(result.version);
            if (result.version.length === 1) {
                result.version = result.version[0];
            }
        }
        if (_.isArray(result.group)) {
            result.group = _.uniq(result.group);
            if (result.group.length === 1) {
                result.group = result.group[0];
            }
        }
        return result;
    });

    results = _.sortBy(results, 'name');

    spinner.stop();

    switch(format) {
        case 'xls':
            console.log('Saving report to XSL file...');
            await callAsync(
                fs.writeFile,
                path.resolve(`./${reportFileName}.xls`),
                json2xls(results),
                'binary'
            );
            break;
        case 'json':
        default:
            console.log('Saving report to JSON file...');
            await callAsync(
                fs.writeFile,
                path.resolve(`./${reportFileName}.json`),
                JSON.stringify(results, null, 4)
            );
            break;
    }

    console.log(chalk.green(`Done! Packages: ${results.length}. Errors: ${errors.length}`));

})();
