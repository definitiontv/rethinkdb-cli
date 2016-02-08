'use strict';

const GetOpt = require('node-getopt');
const Recli = require('../index');
const Readfile = Recli.Readfile;
const Command = Recli.Commander;

const Opts = [
    ['l' ,'ls'                , 'list dbs'],
    ['T' , 'tablelist'        , 'list tables'],
    ['C' , 'tablecreate='     , 'create table'],
    [''  , 'tabledrop='       , 'drop table'],
    ['t' , 'table='           , 'list table content'],
    [''  , 'filter='          , 'filter by attribute:value [optional]'],
    [''  , 'get='             , 'get object by id [optional]'],
    [''  , 'count'            , 'count [optional]'],
    [''  , 'limit='           , 'limit [optional]'],
    [''  , 'skip='            , 'skip [optional]'],
    [''  , 'changes'          , 'listen to table changes'],
    ['I' , 'insert='          , 'insert, with reference to json file'],
    ['D' , 'delete='          , 'delete table contents'],
    [''  , 'return-changes'   , 'return changes [optional]'],
    [''  , 'dbcreate='        , 'create db'],
    [''  , 'dbdrop='          , 'drop db'],
    ['h'  , 'help'            , 'display this help'],
    ['v' , 'version'          , 'show version'],
    [''  , 'verbose'          , 'be verbose'],
    [''  , 'db='              , 'db name'],
    [''  , 'host='            , 'hostname'],
    [''  , 'port='            , 'port number'],
    [''  , 'auth_key='        , 'authentication key']
];

const Config = function (options) {

    return {
        db: options.db || 'test',
        host: options.host,
        port: options.port,
        auth_key: options.auth_key
    };
};

const opts = GetOpt.create(Opts)
    .bindHelp();

const commander = new Command();

commander.on('connect', (msg) => {

    if (getOpt.options.verbose) {
        console.log(msg);
    }
    runner(getOpt.options,getOpt.argv);
});

commander.on('message', (msg) => {

    console.log(msg);
    commander.close();
});

commander.on('change', (tableName, item) => {

    console.log(tableName + ' changed :', item);
});

commander.on('error', (err) => {

    console.log(err);
    commander.close();
});

const getOpt = opts.parseSystem();

if (getOpt.options.version) {
    Readfile('./package.json').then( (pkg) => {

        console.log('Version ' + pkg.version);
    });
}
else if (Object.keys(getOpt.options).length < 1 ) {
    opts.showHelp();
}
else {
    commander.connect(Config(getOpt.options));
}

const runner = function (options,args) {

    if (options.dbcreate) {
        return commander.exec('dbCreate', options.dbcreate);
    }

    if (options.dbdrop) {
        return commander.exec('dbDrop', options.dbdrop);
    }

    if (options.ls) {
        return commander.exec('dbList');
    }

    if (options.tablelist) {
        return commander.exec('tableList');
    }

    if (options.get) {
        if (!options.table) {
            return commander.emit('error', 'Can\'t do that without the table switch');
        }
        return commander.exec('get', options.table, options.get);
    }

    if (options.changes) {
        return commander.exec('changes', options.table);
    }

    if (options.table) {
        return commander.exec('table', options.table,options.filter,options.count,options.limit, options.skip);
    }

    if (options.tablecreate) {
        return commander.exec('tableCreate', options.tablecreate);
    }

    if (options.tabledrop) {
        return commander.exec('tableDrop', options.tabledrop);
    }

    if (options.delete) {
        return commander.exec('delete', options.delete);
    }

    if (options.insert) {
        return Readfile(options.insert).then( (data) => {

            commander.exec('insert', data, options['return-changes']);
        }, (err) => {

            commander.emit('error',err.msg);
        });
    }

    console.log('Noop. Did you want something?');
    commander.close();
};

