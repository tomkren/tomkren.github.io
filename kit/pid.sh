#!/bin/bash
ps x | grep "node test.js$" | awk '{print $1}' | cat
