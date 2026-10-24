
# graphify
- Before reading source files to answer a codebase question, query the graph: `"$(cat graphify-out/.graphify_python)" -m graphify query "<question>" --budget 800` (bare `graphify` is not on PATH). Read files only for the lines the graph points to.
- After creating new files, ask the user to run `/graphify . --update` before finishing the turn.
