# andvari
Micro static site generator in Node.js

Used to build a github page.
I built this because octopress has basically become defunct. I tried to find a resonable [alternative](https://www.staticgen.com/), but none achieved what I wanted (though hexo came close).

It was relatively simple to build a site generator in Javascript (though I admit it is basic).

## Create a new site

This description is to build a GitHub Pages site. But you can use any github repository as the site.

In the description below I will use my own site details. You should change "Loki-Astari" to your github user name.

1. Create a "Git Hub Pages repo"

      > [Create-Repo](https://github.com/new)  
      > Use the 'Repository name': loki-astari.github.io  

2. Install Andvari

      > &gt; cd Location/Where/You/Install/Stuff  
      > &gt; git clone git@github.com:Loki-Astari/andvari.git  
      > &gt; export PATH=${PATH}:$(pwd)/andvari/bin  
      
3. Create a Blog Directory

      > &gt; cd Location/to/Create/Your/Blog  
      > &gt; mkdir MyBlog  
      > &gt; cd MyBlog  
      > &gt; andvari init -r https://github.com/Loki-Astari/loki-astari.github.io  
      
4. Deploy the Default Blog

      > &gt; andvari deploy  
      
5. Look at your Blog

      https://loki-astari.github.io  
      
6. Now that you have seen it works change up the config file

      > &gt; vi config.json
      
This file contains some basic information you can edit. Also you should check the theme config. If you want to override any values just place the the new value in your local config.h. Check the themes documentation (README.md) file for information about the theme and how changes to the configuration affect the site.

      > &gt; andvari deply
      
The new site should be available shortly

## Create a new post

1. Create a new article

      > &gt; cd Location/to/Create/Your/Blog/MyBlog  
      > &gt; andvari post blog "My First Post"  
      > Created: source/blog/2018-04-02-my-first-post.md  
      
2. Edit the file (In markdown)

      > &gt; vi source/blog/2018-04-02-my-first-post.md  
      
3. Deploy Your new Page:

      > &gt; andvari deploy  
      
## Want to see your site Locally before publishing

1. Start the local server

      > &gt; cd Location/to/Create/Your/Blog/MyBlog  
      > &gt; andvari server  
      > server running on https://localhost:4000  
      
2. Use your browser to look at the local version of the site

      > [localhost:4000](https://localhost:4000)  
      
3. Rather than deploy simply build the site.

      > &gt; andvari build  

Andvari build generates the site without deploying it to github. Any changes are automatically picked up by the server. Simply refresh the web page.

## Have a domain name and want to use github pages.

I use the domain name 'LokiAstari.com'. To make this autmatically work with github pages.

1. Add information to github Pages so they know where to root your page.

      > &gt; cd Location/to/Create/Your/Blog/MyBlog  
      > &gt; echo "lokiastari.com" > source/CNAME  
      > &gt; andvari deploy   
      
2. Configuring A records with your DNS provider (godaddy/joker etc...)

You should make your domain use the IP address `192.30.252.153` primary and/or `192.30.252.154` secondary.  
See [setting up an apex domain](https://help.github.com/articles/setting-up-an-apex-domain/)
