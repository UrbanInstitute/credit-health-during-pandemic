# source() calls the set-up.R file that calls the libraries that will be used in the process of shaping the data for publication. Rewrite the path if you're not working with same folder structure (data-in, scripts, data-out) and R projects or the here package
source("scripts/set-up.R")

#### functions ####

# from_xls_to_df() takes an Excel file with multiple tabs, collapses them into a nested list of lists and creates a data frame. Each tab is named with the date for the data hosted in that given tab. The code creates a new column including the name of the tab. Then it cleans it to creat a `date` column with month/day/year format. It returns a data frame.
from_xls_to_df <- function(pathFile, thisColumn) {
  sheets <- excel_sheets(pathFile)
  
  temp <- purrr::map_df(sheets, ~dplyr::mutate(readxl::read_excel(pathFile, sheet = .x), sheetname = .x))
  
  temp <- temp %>%
    mutate(
      sheetname = gsub("^.*? ", "", sheetname),
      year = gsub("_.*", "", sheetname),
      month = gsub(".*_", "", sheetname),
      date = paste(month, "01", year, sep="/")
    ) %>%
    select(-c(sheetname, year, month)) %>%
    select(date, !!sym(thisColumn), everything())
  
  return(temp)
}

#### building process ####

### US DATA ###

# The US data is hosted in one tab, so from_xls_to_df() is unnecesary. Rewrite the path if you're not working with same folder structure (data-in, scripts, data-out) and R projects or the here package
us_data <- readxl::read_excel("data-in/COMM_usa_comm_col_breakdown_14 Feb 2022.xlsx") %>%
  mutate(
    year = gsub("_.*", "", pull),
    month = gsub(".*_", "", pull),
    date = paste(month, "01", year, sep="/"),
    place = "US"
  ) %>%
  select(-c(pull, month, year)) %>%
  select(date, place, everything()) %>%
  mutate(across(contains("collpos"), ~gsub("\\$", "", .)))

# the JS code that builds the tool removes the last piece of text after "_" to identify what metric should use. Because of that com_col should change to comcol
colnames(us_data) = gsub("com_col", "comcol", colnames(us_data))

### STATE DATA ###

#Rewrite the path if you're not working with same folder structure (data-in, scripts, data-out) and R projects or the here package
state_data <- from_xls_to_df("data-in/COMM_state_14 Feb 2022.xlsx", "fips") %>%
  mutate(across(contains("collpos"), ~gsub("\\$", "", .)))
names(state_data)[2] <- "place"

# the JS code that builds the tool removes the last piece of text after "_" to identify what metric should use. Because of that com_col should change to comcol
colnames(state_data) = gsub("com_col", "comcol", colnames(state_data)) 

### COUNTY DATA ###

# Rewrite the path if you're not working with same folder structure (data-in, scripts, data-out) and R projects or the here package
county_data <- from_xls_to_df("data-in/COMM_county_2020only_14 Feb 2022.xlsx", "fips") %>%
  mutate(across(contains("collpos"), ~gsub("\\$", "", .)))
names(county_data)[2] <- "place"

# the JS code that builds the tool removes the last piece of text after "_" to identify what metric should use. Because of that com_col should change to comcol
colnames(county_data) = gsub("com_col", "comcol", colnames(county_data))

### SAVE THE NEWLY CREATED DFs ###

# save the three new files in the `data-out` folder. Rewrite the path if you're not working with same folder structure (data-in, scripts, data-out) and R projects or the here package
write_csv(us_data, "data-out/us.csv")
write_csv(state_data, "data-out/state.csv")
write_csv(county_data, "data-out/county.csv")
