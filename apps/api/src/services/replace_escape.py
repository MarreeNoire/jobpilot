import sys
with open('notificationService.ts', 'r') as f:
    lines = f.readlines()

# Find the line index of the match
match_index = -1
for i, line in enumerate(lines):
    if line.strip() == "value.replace(/[&<\"'>]/g, (character) => ({":
        match_index = i
        break

if match_index != -1:
    # Replace the next five lines with the correct HTML escapes
    new_mapping = [
        "      '&': '&',\n",
        "      '<': '<',\n",
        "      '>': '>',\n",
        "      '\"': '"',\n",
        "      \"'\": ''',\n"
    ]
    # Remove the old five lines and insert the new ones
    lines = lines[:match_index+1] + new_mapping + lines[match_index+6:]

with open('notificationService.ts.tmp', 'w') as f:
    f.writelines(lines)
else:
    print("Match not found")
    sys.exit(1)
