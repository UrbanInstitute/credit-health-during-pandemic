# Credit Health during the COVID-19 Pandemic

This repo contains the code for the data tool [Credit Health during the COVID-19 Pandemic](https://apps.urban.org/features/credit-health-during-pandemic/). This tool allows users to find out how credit health has developed since February 2020 at a national, state, and county level. It also provides data on racial disparities in credit health.

## How to update

### Updates in the tool
With every new update, the tool will require changes in the `index.html` and `scripts/main.js` files. In both, there are comments that include the text **UPDATE this**.

### Data inputs
The research team should provide three Excel files for national, state and county data. Each of those files include a tab for every month with available data. These files are not ready for publication.

### Data processing
On the [`source` folder](https://github.com/UrbanInstitute/credit-health-during-pandemic/tree/master/source), there are two R scripts: `set-up.R` and `clean-data.R`.
- `set-up.R` loads the packages used to clean the data. It's not necessary to run it.
- `clean-data.R` takes the three files shared by the research team and formats them for publication (`set-up.R` runs within this script). This is how it works: Each tab in the excel files is collapsed into a single list of lists. The nested list is transformed into a data frame (DF). There's a little bit of cleaning (dollar symbol removed, readable date format, i.e.) and three new DFs are built and saved as csv files (`us.csv`, `state.csv`, `county.csv`). These three files feed the tool. Once created, move them to the [`data/formatted` folder](https://github.com/UrbanInstitute/credit-health-during-pandemic/tree/master/data/formatted).

**DISCLOSURE**
1. Original files built by the researchers might be named differently with every new update. Double-check the files' names and change, if necessary, in `clean-data.R` before running the code.
2. `set-up.R` and `clean-data.R` were originally written to be run within an [R project](https://r4ds.had.co.nz/workflow-projects.html) and using a folder structure with three folders:
- `data-in`, it should include the original data sent by the research team.
- `scripts`, it should include the `set-up.R` and `clean-data.R`.
- `data-out`, it should include the three files generated by `clean-data.R`.

You can replicate that folder structure and create an R project –or use the [here](https://here.r-lib.org/) package instead. You can also rewrite the paths to make it work following whatever system you prefer.

### What if an update includes new metrics
That will require to update `dict.csv`, hosted in the `data` folder. Basically, the file matches the names of variables in the datasets with the names used for each metric in the dropdown menu.

### Hosting the staging version
For clarity and order, host the staging code inside the **features/tpm/credit-health-updates** folder. There, create a new folder **YEAR/MONTH-update** and clone the repo.
