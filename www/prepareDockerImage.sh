#!/bin/bash

## Script for preparing mates-jason docker image
## is considered a module specific script so that extends the dockerAPI.sh

### directories ( should not be changed )
dirMatesWebClient="$( cd "$( dirname "$0" )" && pwd )"	# mates-jason module
dirMates="$dirMatesWebClient/../../"				# mates-parent 
dirDockerfile="$dirMates/docker/mates-web-client/"		# contains all files needed for building image





DEBUG_MATES="on"					   # enable/disable debug logging

# load logger
. $dirMates/docker/logger.sh

log_fail() {

_log_err "ERROR" "$@"
exit 2

}

### copies jar and war file to docker directory
preBuild() {

  # copy mates-web-client into docker feil dir
  log_debug "Copying mates web client to dockerfile directory"
  cp -r $dirMatesWebClient $dirDockerfile || log_fail "Could not copy war file"

  log_info "Dockerfile and resources ready"

exit 0
}

preBuild
