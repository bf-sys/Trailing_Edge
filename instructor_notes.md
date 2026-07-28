# Notes for Instructors  
* This process was a little clunky because I started in the desktop app and moved later to the CLI; summary included to understand how I navigated this and how the agent team performed. 
    * The summary, below, is briefly contained in the `README.md`; I'm breaking it out here for clarity and my POV.  
* Documentation is in the root project directory or in /docs (depending on the item).  
* The assets procured and prepped are in the various subfolders under /agents (e.g. /ship, /hazards, etc.).  


## Key Documentation  
* `README.md`: Contains the crew and the instructions for use; what it produces and key decisions that need to apply on future runs of the team.  
* `/docs/asset-procurement-agent-flow.md`: Mermaid diagram for the team.  
* `/docs/phase1-prep-log.md`:  Summary of what the agents have done so far.  
* `/.claude/agents/*agents.md`: The agent markdown files themselves for the sourcing, evaluation, and prep agents.  


## Brief Summary  
* Worked with Claude to evaluate GDD and develop a required art asset list.  
* Had Claude Desktop create a three agent team to find open source art on the internet, vet that art against the project needs (art asset list and GDD), and then prep that art for use in Phaser.  
* Claude Desktop ran the agent team and the sourcing and evaluation agents were successful, but the prep agent had no file system access and couldn't run from the Desktop app.  Additionally, it got a bit confused about the full scope and what to do with the Relay Beacon asset, so I targeted only Phase 1 (initial prototype) assets and deferred the Relay Beacon.  
* I had Claude Desktop generate a suite of documentation as I realized I'd have to move the entire thing to Claude Code CLI; these files were all downloaded and put in the Windows project directory, along with the GDD and art asset list:  
  * `README.md`: explained the agent team  
  * `\*agents.md`: detailed the agents  
  * `STATUS.md`: What the agents accomplished and what was still left to do.  
  * `ATTRIBUTION.md`: Specified the open source category of all assets evaluated.  
  * `phase1-manifest-and-tasks.md`: directory convention and a concrete extraction task per identified file.  
  * `run-log-2026-07-24.md`: slightly redundant, but more detailed log I had it create to spell out what the agents actually did.
* Had Claude Code CLI generate a `CLAUDE.md` for the project using all the documentation and generate the suggested path structure and move the files to their proper folder.  
* To finish the previous agent team run, I ran the prep agent by itself from Claude Code CLI and it successfully continued the run and prepped the previously identified assets (using `STATUS.md` and `phase1-manifest-and-tasks.md`).  It updated the `ATTRIBUTION.md` file to spell out the open source category of every asset that was prepped.  
* Due to the agent team's earlier confusion, I had Claude Code CLI evaluate the `\*agents.md` against the output logs and suggest updates to the agent files based on the results.  Agents were updated.  
* I then ran the agent team entirely from the CLI targeting just the Relay Beacon asset with the direction to use something that looked like a satellite.  
* The team successfully found an asset and prepped it.  Using the asset list and GDD, it also took the initiative to produce a VFX overlay for the Relay Beacon to be used in its 'active' state.  
* It updated all the relevant documentation (`STATUS.md` and `ATTRIBUTION.md`) but also created a new file, `phase1-prep-log.md` to summarize the completion of the Phase 1 asset procurement.  
* **Important Note**: I have not actually built the prototype yet, so my final approval of the assets has not happened yet.  I will still need to vet the assets in the prototype (e.g. comparative scale and readability).  There will likely be a later step of revising the art for consistency and style, but I don't want that process gating initial development.  

