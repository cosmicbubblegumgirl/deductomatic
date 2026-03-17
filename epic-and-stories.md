# Epic and Stories

## Epic Title
**Modernise the DeductoMatic: From Basic Browser-based to Cloud-based Sprinkle Machine**

## Epic Description
The DeductoMatic has been a faithful companion. Time to give it a glow-up.

This Epic transforms a basic web application into a refined, containerized, and cloud-based application with a rock-solid CI/CD process. The objective is to make the application look modern, reliable, and subtly professional by containerizing it with Docker, testing it with Jasmine tests, and deploying it only when everything is green.

Translation: Fewer bugs, more confidence, and a process with just enough sparkle.

## Story 1 — Containerize the Application
**As a developer,** I want to containerize the DeductoMatic application using Docker, **so that** it runs smoothly on any environment without the usual “but it worked on my machine” exception.

### Acceptance Criteria
- Create a Dockerfile using `nginx` as a base image.
- Copy application files into a Docker container individually.
- Ensure Docker image build is successful.
- Ensure application runs locally inside a Docker container on port `8080`.

## Story 2 — Deploy the Application to IBM Cloud
**As a product owner,** I want to deploy the DeductoMatic application to IBM Cloud, **so that** it is available online for users to access, moving it outside the comfortable environment of running on a local machine.

### Acceptance Criteria
- Ensure Docker image is correctly tagged for IBM Cloud Container Registry.
- The image is successfully pushed to IBM Cloud Container Registry.
- The application is deployed to IBM Cloud Code Engine.
- Verification of deployment and live application is possible.

## Story 3 — Add Unit Testing with Jasmine
**As a quality-focused developer,** I want to add Jasmine unit tests to ensure my tax calculation rules are correct, **so that** my application does not become creatively wrong through accidental coding mistakes.

### Acceptance Criteria
- Jasmine is correctly configured to support my project.
- I have written unit tests to ensure my tax calculation rules are correct.
- I can see that `7 specs, 0 failures` when I run my tests.
- I can capture my test results to be used as part of my submission.

## Story 4 — Create Tekton Tasks for Install and Test
**As a DevOps engineer,** I want to add Tekton tasks to my pipeline that install dependencies and test my application using Jasmine, **so that** my pipeline can ensure my application is correct instead of relying on crossed fingers and good vibes.

### Acceptance Criteria
- I have added a Tekton task to install dependencies using `npm install` to `tasks.yaml`.
- I have added a Tekton task to test my application using `npx jasmine` to `tasks.yaml`.
- I have selected a suitable Node.js image for my tasks.
- I am ready to add my tasks to my pipeline.

## Story 5 — Extend the Pipeline to Build Only After Tests Pass
**As a release manager,** I want to extend my pipeline to install dependencies and then test my application before I build my image, **so that** my application does not sneak through and become creatively wrong.

### Acceptance Criteria
- The file `pipeline.yaml` contains the sequence of `npminstall`, `jasmine`, and `build`.
- The build is dependent on the successful conclusion of the tests.
- The pipeline is runnable using the file `run.yaml`.
- The logs from the pipeline show the stages executing in the right order.

## Story 6 — Deploy the Pipeline-Built Image
**As a stakeholder,** I want the image built by the pipeline to be deployed to IBM Cloud, **so that** the final release is the result of the automated delivery process instead of a one-off manual deployment.

### Acceptance Criteria
- The image built by the pipeline is present in the registry.
- The application is using the image built by the pipeline.
- The final live application is accessible in the browser.
- A final screenshot is present to show that the deployment was successful.

## Tiny Project Vibe Check
Our project is about one big idea:

> Make software delivery smoother, safer, and a little more magical.

We start from a simple calculator and finish with a cloud-based application that is tested and automated, looking good and acting good, and feels like it’s ready to go out into the real world.

That’s not DevOps.  
That is **organized enchantment**.
