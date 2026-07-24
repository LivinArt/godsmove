@echo off
echo Checking routes...
curl -s -o NUL -w "/ (home): %%{http_code}\n" http://localhost:3000/
curl -s -o NUL -w "/drops: %%{http_code}\n" http://localhost:3000/drops
curl -s -o NUL -w "/exclusive-rack: %%{http_code}\n" http://localhost:3000/exclusive-rack
curl -s -o NUL -w "/exclusive-unlock (should 404): %%{http_code}\n" http://localhost:3000/exclusive-unlock
curl -s -o NUL -w "/our-story: %%{http_code}\n" http://localhost:3000/our-story
curl -s -o NUL -w "/product/void-tee-black: %%{http_code}\n" http://localhost:3000/product/void-tee-black
echo Done.
