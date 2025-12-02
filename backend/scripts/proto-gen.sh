#!/bin/bash
set -e
PROTOC=`which protoc`

mkdir -p core/proto-interfaces

echo "Using protoc at: $PROTOC"

TS_ARGS=(
          'nestJs=true'
          'snakeToCamel=false'
          'unrecognizedEnum=false'
          'addGrpcMetadata=true'
          'useOptionals=all'
          'annotateFilesWithVersion=false'
          'fileSuffix=.pb'
        )
echo "ts_proto_opts: $(IFS=, ; echo "${TS_ARGS[*]}")"

find ./share/protos -name "*.proto" -print0 | while IFS= read -r -d $'\0' f; do
  REL_PATH=$(echo "$f" | sed 's|./share/protos/||' | sed 's|/[^/]*$||')
  # mkdir -p "./core/proto-interfaces/$REL_PATH"

  echo "Generate stubs for $f file"
  protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
         --ts_proto_out=./core/proto-interfaces \
         --proto_path=./share/protos \
         "$f" \
         --ts_proto_opt="$(IFS=, ; echo "${TS_ARGS[*]}")"
done
