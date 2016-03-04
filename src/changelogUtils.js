import Bluebird from 'bluebird';
import _ from 'lodash';
import got from 'got';

import { getModuleInfo } from './packageUtils';
import { getRepositoryInfo } from './repositoryUtils';

const COMMON_CHANGELOG_FILES = [ 'CHANGELOG.md', 'History.md', 'CHANGES.md', 'CHANGELOG' ];

export async function findModuleChangelogUrl(moduleName) {

    const { changelog, repository } = await getModuleInfo(moduleName);

    if (changelog) {
        return changelog;
    }

    if (repository && repository.url) {
        // If repository is located on one of known hostings, then we will try to request
        // some common changelog files from there or return URL for "Releases" page
        const { fileUrlBuilder, releasesPageUrl } = getRepositoryInfo(repository.url) || {};

        if (fileUrlBuilder) {
            const possibleChangelogUrls = _.map(COMMON_CHANGELOG_FILES, fileUrlBuilder);

            try {
                return await Bluebird.any(
                    _.map(possibleChangelogUrls, url =>
                        Bluebird
                            .try(() => got(url))
                            .return(url)
                    )
                );
            } catch (err) {
                if (!(err instanceof Bluebird.AggregateError)) throw err;
            }
        }

        if (releasesPageUrl) {
            try {
                // Checking `releasesUrl`...
                await got(releasesPageUrl);
                // `releasesUrl` is fine
                return releasesPageUrl;
            } catch (err) {
                // `releasesPageUrl` is broken
            }
        }
    }

    return null;
}
