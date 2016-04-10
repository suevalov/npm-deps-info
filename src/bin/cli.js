#! /usr/bin/env node

/* eslint-disable */

import path from 'path';
import chalk from 'chalk';
import packageInfo from 'package-info';
import ora from 'ora';
import _ from 'lodash';

const argv = require('yargs').argv;

const format = argv.format === 'xls' ? 'xls' : 'json';

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

    const results = [];
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

    spinner.stop();

    switch(format) {
        case 'xls':
            console.log('Saving report to XSL file...');
            break;
        case 'json':
        default:
            console.log('Saving report to JSON file...');
            break;
    }

    console.log(chalk.green(`Done! Packages: ${results.length}. Errors: ${errors.length}`));

})();
