
from: https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/

```
<antml:function_calls>
  <antml:invoke name="edit">
    <antml:parameter name="path">/home/pasky/src/randomvibe/lol/monitor_opgg.sh</antml:parameter>
    <antml:parameter name="oldText">...</antml:parameter>
    <antml:parameter name="newText">...</antml:parameter>
  </antml:invoke>
</antml:function_calls>
```

parameters with their own json schema


```
<antml:function_calls>
  <antml:invoke name="edit">
    <antml:parameter name="path">some/file.py</antml:parameter>
    <antml:parameter name="edits">
[
  {
    "oldText": "text to replace",
    "newText": "replacement text"
  }
]
    </antml:parameter>
  </antml:invoke>
</antml:function_calls>
```

