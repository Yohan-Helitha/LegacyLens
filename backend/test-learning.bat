@echo off
set "JAVA_HOME=C:\sqldeveloper\jdk\jre"
set "PATH=C:\sqldeveloper\jdk\jre\bin;%PATH%"
"C:\Users\Administrator\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd" test "-Djvm=C:\sqldeveloper\jdk\jre\bin\java.exe" "-Dtest=lk.ac.sliit.legacylens.learning.**.*Test"
