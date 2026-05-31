---
title: projects
author: Hunter Paulson
lang: en
description: Selected software projects and experiments by Hunter Paulson.
canonical-url: "https://hunterpaulson.dev/projects/"
og-type: "website"
site-name: "hunter paulson"
social-description: "Selected software projects and experiments by Hunter Paulson."
social-image-alt: "ASCII black hole animation from Hunter Paulson's personal website."
social-image-height: 769
social-image-type: "image/gif"
social-image-url: "https://hunterpaulson.dev/assets/social/home-blackhole.gif"
social-image-width: 769
social-title: "hunter paulson | projects"
twitter-card: "summary_large_image"
---

# personal projects

## [wikiarena.org](https://wikiarena.org)

> can LLMs actually navigate a website that is in their training data?

a benchmark for agentic web navigation where LLMs compete to navigate from one Wikipedia page to another in the fewest number of steps.

## wikipedia race solver

while building [wikiarena.org](https://wikiarena.org) I got [nerd sniped](https://xkcd.com/356/) into building what may be [the fastest wikipedia race solver on the internet](/blog/wikipedia-race-solver/).

## [typeGPT.dev](https://typegpt.dev)

> _Can you type faster than GPT-2?_

runs GPT-2 locally in-browser using [WebGPT](https://github.com/0hq/WebGPT) and generates typing tests using only words in the selected wordset. 

I built this to learn local llm inference and also so I could practice typing probable word sequences instead of words sampled uniformly at random.

# work experience 

## PayPal - Machine Learning Engineer

led the creation of PayPal's central agent harness 'Pal'. allowing any team to build MCP servers and create their own agents / workflows in a self-serve manner.

designed the algorithm and built the infrastructure to identify the root-cause component of every customer-perceived failure in real time. data was used to identify and triage issues, reclaiming $40M in revenue. Equivalent to ~1% growth of branded checkout in 2025.

building and maintaining real-time metrics pipelines for _every_ http response and server log across all PayPal brands. the single, structured, source of truth for all site reliability metrics.

wrote transpiler from python to bigquery sql.

automated data lineage documentation by parsing and creating graph from every sql query ran in the company daily.

## Boeing - ML Research Assistant

trained computer vision models and built data labeling pipelines for assemply line automation

## NASA JPL - Flight Software Engineer Intern

contributed to the open source [flight software framework](https://github.com/nasa/fprime) that supported the [Mars Helicopter Ingenuity](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/). 

fun fact: I [ran the autoformatter](https://github.com/nasa/fprime/pull/184).

## ASU Cube Satelite Lab

worked on the [Phoenix 3U Cube Satelite](https://phxcubesat.asu.edu/). launched from the ISS on Feb 19, 2020.
