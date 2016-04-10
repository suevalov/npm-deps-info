#! /usr/bin/env node

/* eslint-disable */

import path from 'path';
import chalk from 'chalk';
import _ from 'lodash';
import packageInfo from 'package-info';
import ora from 'ora';

const argv = require('yargs').argv;

const format = argv.format === 'xls' ? 'xls' : 'json';

import { DEPS_GROUPS, callAsync } from '../utils';

(async function main() {

    // Loading `package.json` from the current directory
    const packageFile = path.resolve('./package.json');
    let packageJson;
    try {
        packageJson = require(packageFile);
    } catch (err) {
        console.error(chalk.red(`Error loading package.json: ${err.message}`));
        process.exit(1);
    }

    let deps = DEPS_GROUPS
            .map((group) => {
                const deps = packageJson[group.field];
                if (deps) {
                    return {
                        group: group.name,
                        list: deps
                    };
                }
            })
            .filter((chunk) => chunk)
            .map((chunk) => {
                return _.pairs(chunk.list).map((pair) => {
                    const [ name, version ] = pair;
                    return {
                        name,
                        version,
                        group: chunk.group
                    };
                });
            });

    deps = _.union(...deps);

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
