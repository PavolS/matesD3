grammarsRepository=../mates-grammars
grammarVersion=mike-voice-loop
grammarExport=$(grammarsRepository)/data/$(grammarVersion)/export

all: import css docu

import: $(grammarExport)
	[ `ls -a1 $(grammarExport) | wc -l` == '2' ] && echo "Export is empty, check your build env, I'll do nothing here." || ( rm -rf import && cp -rf $(grammarExport) import )

sass/gumby.scss: sass
	compass compile

css:
	echo 'see sass definitions how to build the css, intentionally left for manual compilation' && false

docu:	README.html README.wiki

README.html:	README.md 
	pandoc -f markdown_github -t html -o README.html README.md || true

README.wiki:	README.md 
	pandoc -f markdown_github -t mediawiki -o README.wiki README.md || true

clean:
	rm -rf .sass-cache && find . -name '*~' | xargs rm -rf && echo "You may want to clean the import dir as well: 'rm -rf import'"
