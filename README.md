# andvari
Micro static site generator in Node.js

Used to build a github page.
I built this because octopress has basically become defunct. I tried to find a resonable [alternative](https://www.staticgen.com/), but none achieved what I wanted (though hexo came close).

It was relatively simple to build a site generator in Javascript (though I admit it is basic).

## Create a new site

This description is to build a GitHub Pages site.  
But you can use any github repository as the site.

1. Create a "Git Hub Pages repo"

      [Create-Repo](https://github.com/new)  
      Use the 'Repository name': <GitHubUserName>.github.io  
      ie. for me this is [loki-astari.github.io](https://github.com/Loki-Astari/loki-astari.github.io).  

2. Install Andvari

      > cd <Location Where You Install Stuff>
      > git clone git@github.com:Loki-Astari/andvari.git
      > export PATH=${PATH}:$(cwd)/andvari/bin
      
3. Create a Blog Directory

      > cd <Location to Create Your Blog>
      > mkdir MyBlog
      > cd MyBlog
      > andvari init -r https://github.com/<GitHubUserName>/<GitHubUserName>.github.io
      
4. Deploy the Default Blog

      > andvari deploy
      
5. Look at your Blog

      https://<GitHubUserName>.github.io

## Create a new post

1. Create a new article

      > cd <Location to Create Your Blog>/MyBlog
      > andvari post blog "My First Post"
      Created: source/blog/2018-04-02-my-first-post.md
      
2. Edit the file (In markdown)

      > vi source/blog/2018-04-02-my-first-post.md
      
3. Deploy Your new Page:

      > andvari deploy
      
## Want to see your site Locally before publishing

1. Start the local server

      > andvari server
      server running on https://localhost:4000
      
2. Use your browser to look at the local version of the site

      [localhost:4000](https://localhost:4000)
      
3. Rather than deploy simply build the site.

      > andvari build

Andvari build generates the site without deploying it to github. Any changes are automatically picked up by the server. Simply refresh the web page.
