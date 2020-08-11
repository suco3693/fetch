import fetch from '../util/fetch-fill';
import URI from 'urijs';

// /records endpoint
window.path = 'http://localhost:3000/records';

const baseOptions = {
    page: 1,
    colors: ['red', , 'brown', 'blue', 'yellow', 'green'],
};
const baseOutputData = {
    ids: [],
    open: [],
    closedPrimaryCount: 0,
    previousPage: null,
    nextPage: null,
};
const primaryColor = {
    red: true,
    blue: true,
    yellow: true,
};
// Your retrieve function plus any additional functions go here ...

function constructURL(colors = [], offset) {
    let url = URI(window.path).addSearch('color[]', colors).addSearch('offset', offset).addSearch('limit', 10);
    return url;
}
function updateOffset(oldOffset, newOffset, url) {
    console.log(url);
    url = url.removeSearch('offset', oldOffset);
    url = url.addSearch('offset', newOffset);
    console.log(url);
    return url;
}

function fetchPage(url) {
    return fetch(url)
        .then((res) => {
            return res.json();
        })
        .catch((err) => {
            console.log('Error', err);
        });
}

function retrieveAllRecords(colors, offset) {
    let url = constructURL(colors, offset);
    return fetchPage(url)
        .then(async (resData) => {
            if (resData.length) {
                let endID = resData[resData.length - 1].id;
                let next = await retrieveAllRecords(colors, endID);
                resData = resData.concat(next);
            }
            return resData;
        })
        .catch((err) => {
            console.log(err);
        });
}

function makePage(recordSet, page, maxPage) {
    let set = makeRecords(recordSet, page, maxPage);
    return set;
}
function makePages(rawData) {
    let records = {};
    let page = 1;
    let record = [];
    let maxPage = Math.floor(rawData.length / 10);
    rawData.forEach((item, idx) => {
        record.push(item);
        if (record.length === 10) {
            records[page] = makePage(record, page, maxPage);
            page += 1;
            record = [];
        }
    });
    return records;
}

async function retrieve(options = baseOptions) {
    try {
        let { page = 1, colors, offset = 0 } = options;
        let rawData = await retrieveAllRecords(colors, offset);
        let records = makePages(rawData);
        if (page <= Object.keys(records).length) {
            return records[page];
        } else {
            return makeRecords([], page);
        }
    } catch (err) {
        return err;
    }
}

/*********
 *
 * Construct Output
 *
 */
function addPrimary(record) {
    if (primaryColor[record.color]) {
        record.isPrimary = true;
    } else {
        record.isPrimary = false;
    }
}

function makeRecords(resData, page, maxPage) {
    resData.map(addPrimary);
    let records = Object.assign({}, baseOutputData);
    records.ids = resData.map((record) => record.id);
    records.open = resData.filter((record) => record.disposition === 'open');
    records.closedPrimaryCount = resData
        .filter((record) => record.disposition !== 'open')
        .filter((record) => record.isPrimary).length;

    if (page > 1) {
        records.previousPage = page - 1;
    }
    if (page < maxPage) {
        records.nextPage = page + 1;
    }
    return records;
}
export default retrieve;
