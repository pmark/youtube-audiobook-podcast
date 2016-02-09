# ffmpeg split mp3

mkdir split; 

X=0; while( [ $X -lt 9 ] ); do echo $X; ffmpeg -i the-martian/the-martian.mp3 -acodec copy -t 0${X+1}:00:00 -ss 0$X:00:00 split/the-martian-h${X}.mp3; X=$((X+1)); done;

X=9; echo $X; ffmpeg -i the-martian/the-martian.mp3 -acodec copy -t ${X+1}:00:00 -ss 0$X:00:00 split/the-martian-h${X}.mp3;

X=10; while( [ $X -lt 11 ] ); do echo $X; ffmpeg -i the-martian/the-martian.mp3 -acodec copy -t ${X+1}:00:00 -ss $X:00:00 split/the-martian-h${X}.mp3; X=$((X+1)); done;
