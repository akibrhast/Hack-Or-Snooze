$(async function() {
  // cache some selectors we'll be using quite a bit
  const $navDropDown            = $("#navDropDown");
  const $allStoriesList         = $("#all-stories-container");


  const $loginButton            = $("#login");
  const $loginForm              = $("#login-form");
  const $loginModal             = $("#login-modal");

  const $registerButton         = $("#register");
  const $registerForm           = $("#register-form");
  const $registerModal          = $("#register-modal");

  const $submitStoryButton      = $("#submit-story-button")
  const $submitStoryModal       = $("#submit-story-modal")
  const $submitStoryForm        = $("#submit-story-form")

  const $favouriteStoryButton   = $("#favourite-story-button")
  const $favouriteModal         = $("#favourite-modal")
  const $favoritedStories       = $("#favourite-stories-container")

  const $ownStoryButton         = $("#own-story-button")
  const $ownStoryModal          = $("#own-story-modal")
  const $ownStories             = $("#own-stories-containers")

  const $profileButton          = $("#profile") 
  const $profileModal           = $("#profile-modal");               
  const $logoutButton           = $("#logout");



    // global storyList variable
    let storyList = null;

    // global user variable
    let currentUser = null;

    await checkIfLoggedIn();


    /**
     * Event Handler for Clicking Login
     */
    $loginButton.on("click", function() {
        $loginModal.modal('show');
    });

    /**
     * Event Handler For Submitting the Login Form
     */
    $loginForm.on("submit", async function(evt){
        evt.preventDefault(); // no page refresh

        // grab the username and password
        const username = $("#login-username").val();
        const password = $("#login-password").val();

        // call the login static method to build a user instance
        const userInstance = await User.login(username, password);

        // set the global user to the user instance
        currentUser = userInstance;
        syncCurrentUserToLocalStorage();

        checkIfLoggedIn()
        //Hide Login Modal
        $loginModal.modal('hide');

    })

    /**
     * Log Out Functionality
     */
    $logoutButton.on("click", function() {
        // empty out local storage
        localStorage.clear();
        // refresh the page, clearing memory
        location.reload();
    });


    /**
     * Event Handler for Clicking Register
     */
    $registerButton.on("click", function() {
        $registerModal.modal('show');
    })

    /**
     * Event Handler For Submitting the Login Form
     */
    $registerForm.on("submit", async function(evt){
        evt.preventDefault(); // no page refresh

        // grab the required fields
        const name     = $("#create-account-name").val();
        const username = $("#create-account-username").val();
        const password = $("#create-account-password").val();


        // call create method, which calls  API and then builds a new user instance
        const newUser = await User.create(username, password, name);

        currentUser = newUser;
        syncCurrentUserToLocalStorage();
        checkIfLoggedIn();
        //Hide Register Modal
        $registerModal.modal('hide');

    })


    /**
     * Event Handler for Clicking Submit Button
     */
    $submitStoryButton.on("click", function() {
        $submitStoryModal.modal('show');
    });

    /**
     * Event Handler For Submitting the Login Form
     */
    $submitStoryForm.on("submit", async function(evt){
        evt.preventDefault(); // no page refresh

        // grab all the info from the form
        const title = $("#title").val();
        const url = $("#url").val();
        const hostName = getHostName(url);
        const author = $("#author").val();
        const username = currentUser.username

        const storyObject = await storyList.addStory(currentUser, {
        title,
        author,
        url,
        username
        });


        $allStoriesList.prepend(`
        <div class="row mb-1" id="${storyObject.storyId}">
        <div class="col-sm">
            <div class="card  text-white bg-dark mb-1">
                <div class="card-header">
                    <a class="article-link" href="${url}" target="a_blank">
                        <strong>${title}</strong>
                    </a>
                </div>
                    <div class="card-footer text-muted">
                        Posted by <small class="article-author">by ${author}</small>
                        <small class="article-hostname ${hostName}">(${hostName})</small>
                        <small class="article-username">posted by ${username}</small>
                    </div>
            </div>
        </div>
        </div>
        ` );

        //Hide Submit Story Modal
        $submitStoryModal.modal('hide');

    })

    $favouriteStoryButton.on("click",function(){
        generateFaves();
        $favouriteModal.modal("show")
    })

    /**
     * A rendering function to build the favorites list
     */
    function generateFaves() {
    // empty out the list by default
    $favoritedStories.empty();

    // if the user has no favorites
    if (currentUser.favorites.length === 0) {
        $favoritedStories.append("<h5>No favorites added!</h5>");
    } else {
        // for all of the user's favorites
        for (let story of currentUser.favorites) {
        // render each story in the list
        let favoriteHTML = generateStoryHTML(story,false,true);
        $favoritedStories.append(favoriteHTML);
        }
    }
    }

    /**
    * Event Handler for showing the profile modal
    */
    $profileButton.on('click',function(){
        $profileModal.modal('show')
    })

    /**
    * Event Handler for showing the own story modal
    */
    $ownStoryButton.on("click",function(){
        generateMyStories();
        $ownStoryModal.modal("show")
    })

    /**
     * A rendering function to build show own stories
     */
    function generateMyStories() {
        $ownStories.empty();

        // if the user has no stories that they have posted
        if (currentUser.ownStories.length === 0) {
          $ownStories.append("<h5>No stories added by user yet!</h5>");
        } else {
          // for all of the user's posted stories
          for (let story of currentUser.ownStories) {
            // render each story in the list
            let ownStoryHTML = generateStoryHTML(story,true);
            $ownStories.append(ownStoryHTML);
          }
        }

        // $ownStories.show();
    }

    /**
     * Event Handler for Deleting a Single Story
     */
    $ownStories.on("click", ".trash-can", async function(evt) {
        // get the Story's ID
        const storyId = $(evt.target).parents().eq(3).attr('id');
        // remove the story from the API
        await storyList.removeStory(currentUser, storyId);

        // re-generate the story list
        await generateStories();

        // // hide everyhing
        // hideElements();

        // // ...except the story list
        //$allStoriesList.show();
    });



    /**
     * On page load, checks local storage to see if the user is already logged in.
     * Renders page information accordingly.
     */
    async function checkIfLoggedIn() {
        // let's see if we're logged in
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");

        // if there is a token in localStorage, call User.getLoggedInUser
        //  to get an instance of User with the right details
        //  this is designed to run once, on page load
        currentUser = await User.getLoggedInUser(token, username);
        await generateStories();

        if (currentUser) {

            generateProfile();
            showNavForLoggedInUser();
        }
    }

    function showNavForLoggedInUser() {

        //Hide Login button
        $loginButton.toggle();
        //Hide Register Button
        $registerButton.toggle();
        //Show Logged In Nav items
        $('#loggedinitems').toggleClass("invisible")
        //Display Profile Button
        $('#profile').toggle();
        //Display Logout Button
        $logoutButton.show();
    }

    /**
     * A rendering function to call the StoryList.getStories static method,
     *  which will generate a storyListInstance. Then render it.
     */
    async function generateStories() {
        // get an instance of StoryList
        const storyListInstance = await StoryList.getStories();
        // update our global variable
        storyList = storyListInstance;
        // empty out that part of the page
        $allStoriesList.empty();

        // loop through all of our stories and generate HTML for them
        for (let story of storyList.stories) {
            const result = generateStoryHTML(story);
            $allStoriesList.append(result);
        }
    }

    /**
     * A render method to render HTML for an individual Story instance
     * - story: an instance of Story
     * - isOwnStory: was the story posted by the current user
     */
    function generateStoryHTML(story, isOwnStory) {
        let hostName = getHostName(story.url);
        let starType = isFavorite(story) ? "fas" : "far";

        // render a trash can for deleting your own story
        const trashCanIcon = isOwnStory
          ? `
          <button class="btn btn-outline-primary float-right trash-can">
            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>`: "";


        // render all the rest of the story markup
        const storyMarkup = $(`
        <div class="row mb-1" id="${story.storyId}">
        <div class="col-sm">
            <div class="card  text-white bg-dark mb-1">
                <div class="card-header">
                    <span type="button" class="star"><i class="${starType} fa-star"></i></span>
                    <a class="article-link" href="${story.url}" target="a_blank">
                    <strong>${story.title}</strong>
                    </a>
                    ${trashCanIcon}

                </div>
                    <div class="card-footer text-muted">
                        Posted by <small class="article-author">by ${story.author}</small>
                        <small class="article-hostname ${hostName}">(${hostName})</small>
                        <small class="article-username">posted by ${story.username}</small>
                    </div>
            </div>
        </div>
        </div>
        `);

        return storyMarkup;
        }


    /* simple function to pull the hostname from a URL */
    function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
        hostName = url.split("/")[2];
    } else {
        hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
        hostName = hostName.slice(4);
    }
    return hostName;
    }


    /* sync current user information to localStorage */
    function syncCurrentUserToLocalStorage() {
        if (currentUser) {
            localStorage.setItem("token", currentUser.loginToken);
            localStorage.setItem("username", currentUser.username);
        }
    }


    /**
     * Build a user profile based on the global "user" instance
     */

    function generateProfile() {

    // show your name
    $("#profile-name").append(`
                            <div class="col-sm-3">
                                <span class="badge badge-pill badge-dark">Name</span>
                            </div>
                            <div class="col-sm-9">
                                <p class="text-capitalize">${currentUser.name}</p>
                            </div>
                            `);
    // show your username
    $("#profile-username").append(`
                            <div class="col-sm-3">
                                <span class="badge badge-pill badge-dark">Username</span> 
                            </div>
                            <div class="col-sm-9">
                                <p class="text-capitalize">${currentUser.username}</p>
                            </div>
                            `);
    // format and display the account creation date
    $("#profile-account-date").append(`
                                    <div class="col-sm-3">
                                        <span class="badge badge-pill badge-dark">Account Created</span>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-capitalize">${currentUser.createdAt.slice(0, 10)}</p>
                                    </div>
                                    `);
    // set the navigation to list the username
    $navDropDown.text(`${currentUser.name}`)
    }


   /**
   * Starring favorites event handler
   *
   */
  $(".star").on("click", async function(evt) {
    if (currentUser) {
      const $tgt = $(evt.target);

    // get the Story's ID
      const storyId = $(evt.target).parents().eq(4).attr('id');

      // if the item is already favorited
      if ($tgt.hasClass("fas")) {
        // remove the favorite from the user's list
        await currentUser.removeFavorite(storyId);
        // then change the class to be an empty star
        $tgt.closest("i").toggleClass("fas far");
      } else {
        // the item is un-favorited
        await currentUser.addFavorite(storyId);
        $tgt.closest("i").toggleClass("fas far");
      }
    }
  });

  /* see if a specific story is in the user's list of favorites */
  function isFavorite(story) {
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map(obj => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }






});




