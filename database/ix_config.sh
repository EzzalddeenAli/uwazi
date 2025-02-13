#!/bin/bash
DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}
echo -e "\n\nSetting default IX configuration"
mongosh --quiet -host $HOST $DB --eval 'db.settings.updateOne({},{$set : {"features":{
    "metadata-extraction": true,
    "metadataExtraction" :{"url":"http://localhost:5052"},
    "segmentation":{"url":"http://localhost:5051/async_extraction"}}}},{upsert:false,multi:true})'